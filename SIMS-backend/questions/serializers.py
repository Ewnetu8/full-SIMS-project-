from django.db.models import Sum
from rest_framework import serializers

from questions.models import (
    Question,
    QuestionOption,
    QuestionTypeChoices,
    RubricCriterion,
    Tag,
)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class RubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricCriterion
        fields = (
            "id",
            "question",
            "criterion_text",
            "point_weight",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        question = attrs.get("question") or (
            self.instance.question if self.instance else None
        )
        if question is None:
            return attrs
        question_type = question.question_type
        if question_type not in (
            QuestionTypeChoices.SHORT_ANSWER,
            QuestionTypeChoices.ESSAY,
        ):
            return attrs
        new_weight = attrs.get("point_weight") or (
            self.instance.point_weight if self.instance else None
        )
        existing_sum = RubricCriterion.objects.filter(question=question)
        if self.instance:
            existing_sum = existing_sum.exclude(pk=self.instance.pk)
        existing_sum = existing_sum.aggregate(total=Sum("point_weight"))["total"] or 0
        total = existing_sum + new_weight
        if total != question.total_points:
            raise serializers.ValidationError(
                f"Sum of rubric criteria point weights ({total}) must equal question total_points ({question.total_points})."
            )
        return attrs


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = (
            "id",
            "question",
            "option_text",
            "is_correct",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        question = attrs.get("question") or (
            self.instance.question if self.instance else None
        )
        if question is None:
            return attrs
        if question.question_type != QuestionTypeChoices.MCQ:
            return attrs
        is_correct = attrs.get(
            "is_correct", self.instance.is_correct if self.instance else False
        )
        if not is_correct:
            other_correct = QuestionOption.objects.filter(
                question=question, is_correct=True
            )
            if self.instance:
                other_correct = other_correct.exclude(pk=self.instance.pk)
            if not other_correct.exists():
                raise serializers.ValidationError(
                    "At least one option must be marked as correct for MCQ questions."
                )
        return attrs


class QuestionSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Tag.objects.all(), required=False
    )
    options = QuestionOptionSerializer(many=True, read_only=True)
    rubric_criteria = RubricCriterionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = (
            "id",
            "examination",
            "creator",
            "question_text",
            "question_type",
            "total_points",
            "tags",
            "tag_ids",
            "options",
            "rubric_criteria",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "creator", "created_at", "updated_at")

    def _tokenize(self, text):
        import re

        return set(re.sub(r"[^\w\s]", " ", text.lower()).split())

    def _word_overlap_ratio(self, text_a, text_b):
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = tokens_a & tokens_b
        return len(intersection) / max(len(tokens_a), len(tokens_b))

    def validate(self, attrs):
        examination = attrs.get("examination") or (
            self.instance.examination if self.instance else None
        )
        question_text = attrs.get("question_text") or (
            self.instance.question_text if self.instance else None
        )
        if examination and question_text:
            existing = Question.objects.filter(examination=examination)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            for q in existing:
                ratio = self._word_overlap_ratio(question_text, q.question_text)
                if ratio >= 0.7:
                    if not hasattr(self, "_warnings"):
                        self._warnings = []
                    similar_text = q.question_text[:80]
                    self._warnings.append(
                        f"Similar question detected in same examination: '{similar_text}...' (overlap: {ratio:.0%})"
                    )
                    break
        return attrs

    def create(self, validated_data):
        tag_ids = validated_data.pop("tag_ids", [])
        instance = super().create(validated_data)
        if tag_ids:
            instance.tags.set(tag_ids)
        return instance

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop("tag_ids", None)
        instance = super().update(instance, validated_data)
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance
